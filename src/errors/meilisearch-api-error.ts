import { MeiliSearchErrorInfo } from '../types';
import { MeiliSearchError } from './meilisearch-error';

const MeiliSearchApiError = class extends MeiliSearchError {
  httpStatus: number;
  code: string;
  link: string;
  type: string;
  stack?: string;

  constructor(error: MeiliSearchErrorInfo, status: number) {
    super(error.message);

    // Make errors comparison possible. ex: error instanceof MeiliSearchApiError.
    Object.setPrototypeOf(this, MeiliSearchApiError.prototype);

    this.name = 'MeiliSearchApiError';

    this.code = error.code;
    this.type = error.type;
    this.link = error.link;
    this.message = error.message;
    this.httpStatus = status;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MeiliSearchApiError);
    }
  }
};
export { MeiliSearchApiError };
