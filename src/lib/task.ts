import { MeiliSearchTimeOutError } from '../errors'
import { Config, Task, Tasks, WaitOptions } from '../types'
import { HttpRequests } from './http-requests'
import { sleep } from './utils'

class TaskClient {
  httpRequest: HttpRequests

  constructor(config: Config) {
    this.httpRequest = new HttpRequests(config)
  }

  async getClientTask(uid: string | number): Promise<Task> {
    const url = `tasks/${uid}`
    return await this.httpRequest.get<Task>(url)
  }

  async getClientTasks(): Promise<Tasks> {
    const url = `tasks`
    return await this.httpRequest.get<Tasks>(url)
  }

  async getIndexTask(indexUid: string | number, taskId: number): Promise<Task> {
    const url = `indexes/${indexUid}/tasks/${taskId}`
    return await this.httpRequest.get<Task>(url)
  }

  async getIndexTasks(indexUid: string | number): Promise<Tasks> {
    const url = `indexes/${indexUid}/tasks`
    return await this.httpRequest.get<Tasks>(url)
  }

  /**
   * Wait for a task to be processed.
   *
   * @param {number} uid Task identifier
   * @param {WaitOptions} options Additional configuration options
   * @returns {Promise<Task>} Promise returning a task after it has been processed
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
      `timeout of ${timeOutMs}ms has exceeded on process ${taskId} when waiting a task to be resolved.`
    )
  }

  /**
   * Waits for multiple tasks to be processed
   *
   * @param {number} taskIds Tasks identifier list
   * @param {WaitOptions} options Wait options
   * @returns {Promise<Tasks>} Promise returning a list of tasks after they have been processed
   */
  async waitForClientTasks(
    taskIds: number[],
    { timeOutMs = 5000, intervalMs = 50 }: WaitOptions = {}
  ): Promise<Tasks> {
    const tasks: Task[] = []
    for (const taskId of taskIds) {
      const task = await this.waitForClientTask(taskId, {
        timeOutMs,
        intervalMs,
      })
      tasks.push(task)
    }
    return { results: tasks }
  }

  /**
   * Waits for a task to be processed
   *
   * @param {number} taskId Task identifier
   * @param {WaitOptions} options Wait options
   * @returns {Promise<Task>} Promise returning a task after it has been processed
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

export { TaskClient }
