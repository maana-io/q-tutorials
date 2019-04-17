import initServer from './server'
import chalk from 'chalk'

console.log(
  chalk.bgRed('Authentication is disabled. This should not run in production')
)

initServer({
  httpAuthMiddleware: false,
  socketAuthMiddleware: false
})
