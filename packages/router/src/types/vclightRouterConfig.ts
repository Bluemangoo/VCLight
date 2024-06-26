export default interface VCLightRouterConfig {
    /**
     * enable built in routers
     */
    buildInRouters?: {
        /**
         * add builtin 404 router (default true)
         */
        _404?: boolean;
    };
    /**
     * return 404 when no matching router (default true)
     */
    use404Router?: boolean
}