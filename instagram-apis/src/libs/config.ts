import { logger } from '@/utils/logger'
import { isTestEnvironment } from '@/constants'

export const config = {
  database: 'ntask',
  username: '',
  password: '',
  params: {
    dialect: 'sqlite',
    storage: 'ntask.sqlite',
    logging: isTestEnvironment
      ? false
      : (sql: string) => {
          logger.info(`[${new Date()}] ${sql}`)
        },
    define: {
      underscored: true
    },
    jwtSecret: 'secret-key-of-Nta$K-AP1',
    jwtSession: { session: false }
  }
}
