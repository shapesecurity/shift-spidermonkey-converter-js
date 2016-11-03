import SpiderMonkeyConverter from "./to-spidermonkey.js";
import ShiftConverter from "./to-shift.js";

const toSpiderMonkey = SpiderMonkeyConverter.convert.bind(SpiderMonkeyConverter);
const toShift = ShiftConverter.convert.bind(ShiftConverter);

export { SpiderMonkeyConverter, toSpiderMonkey, ShiftConverter, toShift };
