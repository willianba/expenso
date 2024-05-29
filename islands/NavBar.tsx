import { useEffect, useState } from "preact/hooks";

export default function NavBar() {
  const [showBackButton, setShowBackButton] = useState(false);

  useEffect(() => {
    setShowBackButton(location.pathname !== "/");
  }, []);

  const handleBackButtonClick = () => {
    window.history.back();
  };

  return (
    <div class="navbar bg-base-100 fixed top-0 left-0 z-10 py-2 px-4">
      {showBackButton && (
        <button class="btn btn-ghost" onClick={handleBackButtonClick}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill="currentColor"
            class="bi bi-arrow-left"
            viewBox="0 0 16 16"
          >
            <path
              fill-rule="evenodd"
              d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8"
            />
          </svg>
        </button>
      )}
      <a class="btn btn-ghost text-xl" href="/">Expenso</a>
    </div>
  );
}
