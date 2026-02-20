import helmet from "helmet";
import * as helmetStar from "helmet";

console.log("helmet default:", typeof helmet);
console.log("helmet keys:", Object.keys(helmet || {}));
console.log("helmetStar keys:", Object.keys(helmetStar || {}));

try {
  const middleware = helmet();
  console.log("middleware created successfully");
} catch (e) {
  console.error("Error creating middleware:", e);
}
