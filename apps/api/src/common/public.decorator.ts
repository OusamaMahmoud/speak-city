import { SetMetadata } from "@nestjs/common";
export const IS_PUBLIC = "isPublic";
/** Marks a route as reachable without a token. Every other route needs one. */
export const Public = () => SetMetadata(IS_PUBLIC, true);
