/**
 * Use case contract (Application Service): coordinates the domain model for
 * one scenario. Thin, no business logic of its own.
 */
export interface UseCase<Request, Response> {
  execute(request: Request): Promise<Response>;
}
