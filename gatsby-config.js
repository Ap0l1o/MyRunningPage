/**
 * @type {import('gatsby').GatsbyConfig}
 */
module.exports = {
  pathPrefix: '/TraeRunDemo',
  plugins: [
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'runs',
        path: `${__dirname}/content/runs`,
      },
    },
    'gatsby-transformer-remark',
    'gatsby-plugin-image',
    'gatsby-plugin-sharp',
    'gatsby-transformer-sharp',
  ]
}
