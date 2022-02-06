import { Router } from 'express';

interface RouterWrapper {
  path: string
  router: Router
}

export default RouterWrapper;
