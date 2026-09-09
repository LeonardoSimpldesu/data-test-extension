import { render } from "preact";
import { App } from "../panel/main";
import "../panel/styles.css";

render(<App popup />, document.getElementById("app")!);
