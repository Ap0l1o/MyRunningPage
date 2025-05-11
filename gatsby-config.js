/**
 * @type {import('gatsby').GatsbyConfig}
 */
module.exports = {
  pathPrefix: '/MyRunningPage',
  plugins: [
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'runs',
        path: `${__dirname}/content/runs`,
      },
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'profile',
        path: `${__dirname}/src/profile`,
      },
    },
    'gatsby-transformer-remark',
    'gatsby-plugin-image',
    'gatsby-plugin-sharp',
    'gatsby-transformer-sharp',
  ]
}
