import { Link } from "react-router-dom";
import Button from "./Button";
import { useContext } from "react";
import { ThemeContext, LIGHT, DARK, SYSTEM } from "./ThemeProvider";
import { BsMoonFill, BsSunFill } from "react-icons/bs";
import { RiComputerLine } from "react-icons/ri";

function NavigationBar() {
  const themes = [LIGHT, DARK, SYSTEM];
  const { theme, setTheme } = useContext(ThemeContext);

  const handleClick = () => {
    setTheme(themes[(themes.indexOf(theme) + 1) % themes.length]);
  };

  return (
    <nav className="bg-yellow-400 border-yellow-500 dark:bg-gray-900 dark:text-white border-b dark:border-gray-800 shadow-md p-5">
      <div className="flex">
        <h1 className="flex items-center text-2xl tracking-wide hover:cursor-pointer">
          <Link to="/">Pictionary</Link>
        </h1>
        <div className="ms-auto">
          <Button
            customStyle="bg-amber-600 hover:bg-amber-500 text-white dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white p-2 text-xl rounded shadow-md"
            onClickCallback={handleClick}
          >
            {theme === LIGHT && <BsSunFill />}
            {theme === DARK && <BsMoonFill />}
            {theme === SYSTEM && <RiComputerLine />}
          </Button>
        </div>
      </div>
    </nav>
  );
}

export default NavigationBar;
