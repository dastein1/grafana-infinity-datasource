import React from 'react';
import { InlineFormLabel, Switch, useTheme, LegacyForms } from '@grafana/ui';
import { SecureTextArea } from './SecureTextArea';
import { InfinityConfigEditorProps, InfinityConfig, InfinitySecureConfig } from './../../types';

interface TLSConfigEditorProps extends InfinityConfigEditorProps {
  hideTile?: boolean;
}

export const TLSConfigEditor = (props: TLSConfigEditorProps) => {
  const theme = useTheme();
  const { FormField } = LegacyForms;
  const { options, onOptionsChange } = props;
  const { jsonData, secureJsonFields } = options;
  const secureJsonData = (options.secureJsonData || {}) as InfinitySecureConfig;
  const onTLSSettingsChange = (
    key: keyof Pick<InfinityConfig, 'tlsSkipVerify' | 'tlsAuth' | 'tlsAuthWithCACert'>,
    value: boolean
  ) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...options.jsonData,
        [key]: value,
      },
    });
  };
  const onServerNameChange = (serverName: string) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...options.jsonData,
        serverName,
      },
    });
  };
  const onCertificateChange = (key: keyof Omit<InfinitySecureConfig, 'password'>, value: string) => {
    onOptionsChange({
      ...options,
      secureJsonData: {
        ...secureJsonData,
        [key]: value,
      },
    });
  };
  const onCertificateReset = (key: keyof Omit<InfinitySecureConfig, 'password'>) => {
    onOptionsChange({
      ...options,
      secureJsonFields: {
        ...secureJsonFields,
        [key]: false,
      },
      secureJsonData: {
        ...secureJsonData,
        [key]: '',
      },
    });
  };
  const switchContainerStyle: React.CSSProperties = {
    padding: `0 ${theme.spacing.sm}`,
    height: `${theme.spacing.formInputHeight}px`,
    display: 'flex',
    alignItems: 'center',
  };
  return (
    <>
      {!props.hideTile && <h3>TLS / SSL Settings</h3>}
      <div className="gf-form-group">
        <div className="gf-form">
          <InlineFormLabel width={8} tooltip="Skip TLS Verify">
            Skip TLS Verify
          </InlineFormLabel>
          <div style={switchContainerStyle}>
            <Switch
              css={{}}
              className="gf-form"
              value={jsonData.tlsSkipVerify || false}
              onChange={(e) => onTLSSettingsChange('tlsSkipVerify', e.currentTarget.checked)}
            />
          </div>
        </div>
        <div className="gf-form">
          <InlineFormLabel width={8} tooltip="Needed for verifying self-signed TLS Certs">
            With CA Cert
          </InlineFormLabel>
          <div style={switchContainerStyle}>
            <Switch
              css={{}}
              className="gf-form"
              value={jsonData.tlsAuthWithCACert || false}
              onChange={(e) => onTLSSettingsChange('tlsAuthWithCACert', e.currentTarget.checked)}
            />
          </div>
        </div>
        <div className="gf-form">
          <InlineFormLabel width={8} tooltip="TLS Client Auth">
            TLS Client Auth
          </InlineFormLabel>
          <div style={switchContainerStyle}>
            <Switch
              css={{}}
              className="gf-form"
              value={jsonData.tlsAuth || false}
              onChange={(e) => onTLSSettingsChange('tlsAuth', e.currentTarget.checked)}
            />
          </div>
        </div>
        {jsonData.tlsAuthWithCACert && (
          <SecureTextArea
            configured={!!secureJsonFields?.tlsCACert}
            placeholder="Begins with -----BEGIN CERTIFICATE-----"
            label="CA Cert"
            labelWidth={8}
            rows={5}
            onChange={(e) => onCertificateChange('tlsCACert', e.currentTarget.value)}
            onReset={() => onCertificateReset('tlsCACert')}
          />
        )}
        {jsonData.tlsAuth && (
          <>
            <div className="gf-form gf-form--grow">
              <FormField
                label="ServerName"
                labelWidth={8}
                inputWidth={50}
                placeholder="domain.example.com"
                value={jsonData.serverName}
                onChange={(e) => onServerNameChange(e.currentTarget.value)}
              />
            </div>
            <SecureTextArea
              configured={!!secureJsonFields?.tlsClientCert}
              placeholder="Begins with -----BEGIN CERTIFICATE-----"
              label="Client Cert"
              labelWidth={8}
              rows={5}
              onChange={(e) => onCertificateChange('tlsClientCert', e.currentTarget.value)}
              onReset={() => onCertificateReset('tlsClientCert')}
            />
            <SecureTextArea
              configured={!!secureJsonFields?.tlsClientKey}
              placeholder="Begins with -----BEGIN RSA PRIVATE KEY-----"
              label="Client Key"
              labelWidth={8}
              rows={5}
              onChange={(e) => onCertificateChange('tlsClientKey', e.currentTarget.value)}
              onReset={() => onCertificateReset('tlsClientKey')}
            />
          </>
        )}
      </div>
    </>
  );
};
