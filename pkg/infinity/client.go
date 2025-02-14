package infinity

import (
	"crypto/tls"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type Client struct {
	Settings   InfinitySettings
	HttpClient *http.Client
}

func GetTLSConfigFromSettings(settings InfinitySettings) (*tls.Config, error) {
	tlsConfig := &tls.Config{
		InsecureSkipVerify: settings.InsecureSkipVerify,
		ServerName:         settings.ServerName,
	}
	if settings.TLSClientAuth {
		if settings.TLSClientCert == "" || settings.TLSClientKey == "" {
			return nil, errors.New("invalid Client cert or key")
		}
		cert, err := tls.X509KeyPair([]byte(settings.TLSClientCert), []byte(settings.TLSClientKey))
		if err != nil {
			return nil, err
		}
		tlsConfig.Certificates = []tls.Certificate{cert}
	}
	if settings.TLSAuthWithCACert && settings.TLSCACert != "" {
		caPool := x509.NewCertPool()
		ok := caPool.AppendCertsFromPEM([]byte(settings.TLSCACert))
		if !ok {
			return nil, errors.New("invalid TLS CA certificate")
		}
		tlsConfig.RootCAs = caPool
	}
	return tlsConfig, nil
}

func NewClient(settings InfinitySettings) (client *Client, err error) {
	tlsConfig, err := GetTLSConfigFromSettings(settings)
	if err != nil {
		return nil, err
	}
	transport := &http.Transport{
		Proxy:           http.ProxyFromEnvironment,
		TLSClientConfig: tlsConfig,
	}
	httpClient := &http.Client{
		Transport: transport,
		Timeout:   time.Second * time.Duration(settings.TimeoutInSeconds),
	}
	return &Client{
		Settings:   settings,
		HttpClient: httpClient,
	}, err
}

func replaceSecret(input string, settings InfinitySettings) string {
	for key, value := range settings.SecureQueryFields {
		input = strings.ReplaceAll(input, fmt.Sprintf("${__qs.%s}", key), value)
	}
	return input
}

func GetQueryURL(settings InfinitySettings, query Query) (string, error) {
	urlString := query.URL
	if !strings.HasPrefix(query.URL, settings.URL) {
		urlString = settings.URL + urlString
	}
	urlString = replaceSecret(urlString, settings)
	u, err := url.Parse(urlString)
	if err != nil {
		return urlString, nil
	}
	q := u.Query()
	for _, param := range query.URLOptions.Params {
		value := replaceSecret(param.Value, settings)
		q.Set(param.Key, value)
	}
	for key, value := range settings.SecureQueryFields {
		q.Set(key, value)
	}
	u.RawQuery = q.Encode()
	return u.String(), nil
}

func getRequest(settings InfinitySettings, body io.Reader, query Query, requestHeaders map[string]string) (req *http.Request, err error) {
	url, err := GetQueryURL(settings, query)
	if err != nil {
		return nil, err
	}
	switch query.URLOptions.Method {
	case "POST":
		req, err = http.NewRequest("POST", url, body)
	default:
		req, err = http.NewRequest("GET", url, nil)
	}
	if settings.BasicAuthEnabled && (settings.UserName != "" || settings.Password != "") {
		req.Header.Add("Authorization", "Basic "+base64.StdEncoding.EncodeToString([]byte(settings.UserName+":"+settings.Password)))
	}
	if query.Type == "json" || query.Type == "graphql" {
		req.Header.Set("Content-Type", "application/json")
	}
	for _, header := range query.URLOptions.Headers {
		value := replaceSecret(header.Value, settings)
		req.Header.Set(header.Key, value)
	}
	for key, value := range settings.CustomHeaders {
		req.Header.Set(key, value)
	}
	return req, err
}

func (client *Client) req(url string, body *strings.Reader, settings InfinitySettings, isJSON bool, query Query, requestHeaders map[string]string) (obj interface{}, statusCode int, duration time.Duration, err error) {
	req, _ := getRequest(settings, body, query, requestHeaders)
	startTime := time.Now()
	res, err := client.HttpClient.Do(req)
	duration = time.Since(startTime)
	if err != nil {
		return nil, res.StatusCode, duration, fmt.Errorf("error getting response from %s", url)
	}
	defer res.Body.Close()
	if res.StatusCode >= http.StatusBadRequest {
		return nil, res.StatusCode, duration, errors.New(res.Status)
	}
	bodyBytes, err := ioutil.ReadAll(res.Body)
	if err != nil {
		return nil, res.StatusCode, duration, err
	}
	if query.Type == "json" || query.Type == "graphql" {
		var out interface{}
		err := json.Unmarshal(bodyBytes, &out)
		return out, res.StatusCode, duration, err
	}
	if query.Type == "uql" || query.Type == "groq" {
		contentType := res.Header.Get("Content-type")
		if strings.Contains(strings.ToLower(contentType), "application/json") {
			var out interface{}
			err := json.Unmarshal(bodyBytes, &out)
			return out, res.StatusCode, duration, err
		}
	}
	return string(bodyBytes), res.StatusCode, duration, err
}

func (client *Client) GetResults(query Query, requestHeaders map[string]string) (o interface{}, statusCode int, duration time.Duration, err error) {
	isJSON := false
	if query.Type == "json" || query.Type == "graphql" {
		isJSON = true
	}
	switch query.URLOptions.Method {
	case "POST":
		body := strings.NewReader(query.URLOptions.Data)
		if query.Type == "graphql" {
			jsonData := map[string]string{
				"query": query.URLOptions.Data,
			}
			jsonValue, _ := json.Marshal(jsonData)
			body = strings.NewReader(string(jsonValue))
		}
		return client.req(query.URL, body, client.Settings, isJSON, query, requestHeaders)
	default:
		return client.req(query.URL, nil, client.Settings, isJSON, query, requestHeaders)
	}
}
