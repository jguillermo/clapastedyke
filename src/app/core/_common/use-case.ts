/**
 * Base class for Application Services (use cases): one class per user
 * intention. Thin orchestration — loads aggregates, invokes the domain and
 * persists. Holds no business rules of its own.
 */
export abstract class UseCase<Request, Response> {
    abstract execute(request: Request): Promise<Response>;
}
