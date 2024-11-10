import * as core from "@actions/core";
import { generatePermitsFromContext } from "./generate-permits-from-context";

generatePermitsFromContext()
  .then((result) => {
    core.setOutput("result", result);
  })
  .catch((error) => {
    console.error(error);
    core.setFailed(error);
  });
