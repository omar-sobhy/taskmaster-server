type Success<T> = {
  type: 'success'
  data: T
};

type Failure<T = never> = {
  type: 'error'
  errorType: T
  errorData?: unknown
};

type Result<T, E = never> = Success<T> | Failure<E>;

export default Result;
