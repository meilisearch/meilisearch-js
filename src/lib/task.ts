import { MeiliSearchTimeOutError } from '../errors'
import { Config, Task, WaitOptions } from '../types'
import { HttpRequests } from './http-requests'
import { sleep } from './utils'

class Tasks {
  httpRequest: HttpRequests

  constructor(config: Config) {
    this.httpRequest = new HttpRequests(config)
  }

  async getClientTask(uid: string | number): Promise<Task> {
    const url = `tasks/${uid}`
    return await this.httpRequest.get<Task>(url)
  }

  async getClientTasks(): Promise<Task[]> {
    const url = `tasks`
    return await this.httpRequest.get<Task[]>(url)
  }

  async getIndexTask(indexUid: string | number, taskId: number): Promise<Task> {
    const url = `indexes/${indexUid}/tasks/${taskId}`
    return await this.httpRequest.get<Task>(url)
  }

  async getIndexTasks(indexUid: string | number): Promise<Task[]> {
    const url = `indexes/${indexUid}/tasks`
    return await this.httpRequest.get<Task[]>(url)
  }

  /**
   * Waits for a pending update till it has been processed
   * @param {number} updateId Update identifier
   * @param {WaitForPendingUpdateOptions} options Additional configuration options
   * @returns {Promise<Task>} Promise containing Update object after it has been processed
   */
  async waitForClientTask(
    taskId: number,
    { timeOutMs = 5000, intervalMs = 50 }: WaitOptions = {}
  ): Promise<Task> {
    const startingTime = Date.now()
    while (Date.now() - startingTime < timeOutMs) {
      const response = await this.getClientTask(taskId)
      if (!['enqueued', 'processing'].includes(response.status)) return response
      await sleep(intervalMs)
    }
    throw new MeiliSearchTimeOutError(
      `timeout of ${timeOutMs}ms has exceeded on process ${taskId} when waiting for pending update to resolve.`
    )
  }

  /**
   * Waits for multiple tasks to be processed
   * @param {number} taskIds Tasks identifier list
   * @param {WaitOptions} options Wait options
   * @returns {Promise<Task>} Promise containing the processed or failed task
   */
  async waitForClientTasks(
    taskIds: number[],
    { timeOutMs = 5000, intervalMs = 50 }: WaitOptions = {}
  ): Promise<Task[]> {
    const tasks = []
    for (const taskId of taskIds) {
      const task = await this.waitForClientTask(taskId, {
        timeOutMs,
        intervalMs,
      })
      tasks.push(task)
    }
    return tasks
  }

  /**
   * Waits for a task to be processed
   * @param {number} taskId Task identifier
   * @param {WaitOptions} options Wait options
   * @returns {Promise<Task>} Promise containing the processed or failed task
   */
  async waitForIndexTask(
    indexUid: number | string,
    taskId: number,
    { timeOutMs = 5000, intervalMs = 50 }: WaitOptions = {}
  ): Promise<Task> {
    const startingTime = Date.now()
    while (Date.now() - startingTime < timeOutMs) {
      const response = await this.getIndexTask(indexUid, taskId)
      if (!['enqueued', 'processing'].includes(response.status)) return response
      await sleep(intervalMs)
    }
    throw new MeiliSearchTimeOutError(
      `timeout of ${timeOutMs}ms has exceeded on process ${taskId} when waiting for pending update to resolve.`
    )
  }
}

export { Tasks }
