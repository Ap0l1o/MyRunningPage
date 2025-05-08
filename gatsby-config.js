/**
 * @type {import('gatsby').GatsbyConfig}
 */
module.exports = {
  plugins: [
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'runs',
        path: `${__dirname}/content/runs`,
      },
    },
    'gatsby-transformer-remark',
  ]
}
