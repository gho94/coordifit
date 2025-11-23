import { Outlet, useMatches } from "react-router-dom";

import classNames from "classnames/bind";

import BottomNav from "@/components/Layout/BottomNav/BottomNav";
import Header from "@/components/Layout/Header/Header";

import styles from "./Layout.module.css";

const cn = classNames.bind(styles);

const lastDefined = (arr) => [...arr].reverse().find((v) => v !== undefined);

const Layout = () => {
  const matches = useMatches();

  const handles = matches.map((m) => m.handle ?? {});

  const showHeader = lastDefined(handles.map((h) => h.showHeader));
  const showTabbar = lastDefined(handles.map((h) => h.showTabbar));
  const contentPadding = lastDefined(handles.map((h) => h.padding));
  const isNoPad = contentPadding === "none";

  return (
    <div className={cn("page")}>
      <div className={cn("app")}>
        {showHeader !== false && <Header />}
        <main
          className={cn("main-content", {
            "no-padding": isNoPad,
            "no-header": showHeader === false,
          })}
        >
          <Outlet />
        </main>
        {showTabbar && <BottomNav />}
      </div>
    </div>
  );
};

export default Layout;
