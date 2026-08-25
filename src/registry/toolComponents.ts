import { lazy } from "react";
import { tools } from "./tools";

// Built once at module load, not per render — each tool's workspace
// component downloads only when its chunk is first requested.
export const toolComponents = new Map(tools.map((tool) => [tool.id, lazy(tool.load)]));
