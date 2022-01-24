import React from 'react';
import { graphql } from 'gatsby';
import { Link } from 'gatsby';
import { Layout } from '../components/Layout';

export interface TemplateProps {
  data: {
    allMarkdownRemark: {
      edges: {
        node: {
          excerpt: string;
          html: string;
          frontmatter: {
            title: string;
            slug: string;
            date: string;
          };
        };
      }[];
    };
  };
}

export const pageQuery = graphql`
  query {
    allMarkdownRemark(sort: { order: DESC, fields: [frontmatter___date] }, filter: { frontmatter: { slug: { regex: "/blog.*/" } } }) {
      edges {
        node {
          excerpt
          html
          frontmatter {
            title
            slug
            date
          }
        }
      }
    }
  }
`;

export default function Template({ data }: TemplateProps) {
  return (
    <Layout showSubMenu={true} title="Blog">
      <div className="blog-post-container">
        <div className="blog-post">
          <div className="container py-4">
            <h2>Recent blog posts</h2>
            <div className="blog-post-content">
              <ul>
                {data.allMarkdownRemark.edges.map((p) => {
                  return (
                    <li>
                      <Link to={p.node.frontmatter.slug}>{p.node.frontmatter.title}</Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
