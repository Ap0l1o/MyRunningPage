const path = require('path')

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions

  // 为MarkdownRemarkFrontmatter类型定义schema
  const typeDefs = `
    type Segment {
      name: String
      distance: Float
      elapsed_time: Int
      moving_time: Int
      average_heartrate: Float
      max_heartrate: Float
      average_grade: Float
      maximum_grade: Float
      elevation_difference: Float
    }

    type MarkdownRemarkFrontmatter {
      title: String
      name: String
      location: String
      occupation: String
      goal: String
      description: String
      date: Date
      distance: Float
      duration: Float
      elevation: Float
      avg_speed: Float
      max_speed: Float
      avg_pace: Float
      max_pace: Float
      avg_heartrate: Float
      max_heartrate: Float
      calories: Float
      segments: [Segment]
    }
  `

  createTypes(typeDefs)
}

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions
  const result = await graphql(`
    query {
      allMarkdownRemark(filter: {fileAbsolutePath: {regex: "/content\\/runs/"}}) {
        nodes {
          id
          fileAbsolutePath
        }
      }
    }
  `)

  if (result.errors) {
    console.error(result.errors)
    return
  }

  // 为每个跑步数据创建详情页面
  result.data.allMarkdownRemark.nodes.forEach(node => {
    // 从文件路径中提取活动ID
    const activityIdMatch = node.fileAbsolutePath.match(/\/(\d+)_/)
    if (!activityIdMatch) return
    
    const activityId = activityIdMatch[1]
    
    createPage({
      path: `/run/${activityId}`,
      component: path.resolve('./src/templates/run-detail.js'),
      context: {
        id: node.id,
        activityId: activityId
      },
    })
  })
}