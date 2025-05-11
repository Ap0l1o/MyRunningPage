exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions

  // 为MarkdownRemarkFrontmatter类型定义schema
  const typeDefs = `
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
    }
  `

  createTypes(typeDefs)
}