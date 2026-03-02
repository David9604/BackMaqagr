export const paginationMiddleware = () => {
    return (req, res, next) => {
        // Extraer query params
        const pageParam = parseInt(req.query.page, 10);
        const limitParam = parseInt(req.query.limit, 10);
        const sort = req.query.sort || 'id';
        const order = req.query.order && req.query.order.toLowerCase() === 'desc' ? 'desc' : 'asc';

        // Defaults y validaciones
        const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
        let limit = Number.isNaN(limitParam) || limitParam < 1 ? 10 : limitParam;

        // Validar límite máximo de 100
        if (limit > 100) {
            limit = 100;
        }

        // Calcular offset
        const offset = (page - 1) * limit;

        // Agregar a req.pagination
        req.pagination = {
            page,
            limit,
            sort,
            order,
            offset
        };

        next();
    };
};

export default paginationMiddleware;
