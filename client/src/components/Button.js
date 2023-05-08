function Button({ children, onClickCallback, customStyle, disabled }) {
  const handleClick = (e) => {
    if (!disabled) onClickCallback(e);
  };

  return (
    <button
      className={
        customStyle ||
        `bg-gray-950 rounded shadow-sm p-3 hover:bg-gray-800 dark:bg-gray-700 dark:text-white ${
          disabled
            ? "bg-gray-500 hover:bg-gray-500 hover:cursor-auto text-gray-300"
            : "dark:hover:bg-gray-600 hover:cursor-pointer"
        }`
      }
      onClick={handleClick}
    >
      {children}
    </button>
  );
}

export default Button;
