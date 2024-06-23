import { useEffect, useRef, useState } from "preact/hooks";
import useModal from "@/islands/hooks/useModal.tsx";
import { ConfirmationModalContent } from "@/components/ConfirmationModalContent.tsx";
import { RawIncome } from "@/db/models/income.ts";
import { incomeList } from "@/signals/income.ts";
import IncomeForm from "@/islands/forms/IncomeForm.tsx";

type IncomeOptionsButtonProps = {
  income: RawIncome;
};

export default function IncomeOptionsButton(props: IncomeOptionsButtonProps) {
  const { income } = props;

  const {
    Modal: ConfirmationModal,
    isOpen: isConfirmationModalOpen,
    openModal: openConfirmationModal,
    closeModal: closeConfirmationModal,
  } = useModal();
  const {
    Modal: IncomeModal,
    isOpen: isIncomeModalOpen,
    openModal: openIncomeModal,
    closeModal: closeIncomeModal,
  } = useModal();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const onClickDelete = () => {
    openConfirmationModal();
    closeMenu();
  };

  const onClickEdit = () => {
    openIncomeModal();
    closeMenu();
  };

  const deleteExpense = async () => {
    const res = await fetch(`/api/income/${income.id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      // TODO show error message
      closeMenu();
      return;
    }

    const deletedIncome = await res.json() as RawIncome;
    incomeList.value = incomeList.value.filter(
      (expense) => expense.id !== deletedIncome.id,
    );

    closeMenu();
  };

  return (
    <div class="relative" ref={menuRef}>
      <button
        class="flex btn btn-xs btn-ghost"
        onClick={toggleMenu}
      >
        <svg
          class="w-4 h-4 ml-1"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M2 12a2 2 0 100-4 2 2 0 000 4zM8 12a2 2 0 100-4 2 2 0 000 4zm6 0a2 2 0 100-4 2 2 0 000 4z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
      {isOpen && (
        <div class="fixed right-1 bottom-1 mt-2 overflow-hidden shadow-md rounded-box z-50">
          <ul class="menu bg-base-200 rounded-box gap-1">
            <li>
              <button
                class="flex px-3 py-2 text-sm"
                role="menuitem"
                onClick={onClickEdit}
              >
                <svg
                  class="w-5 h-5 mr-1 text-blue-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M 18.414062 2 C 18.158062 2 17.902031 2.0979687 17.707031 2.2929688 L 15.707031 4.2929688 L 14.292969 5.7070312 L 3 17 L 3 21 L 7 21 L 21.707031 6.2929688 C 22.098031 5.9019687 22.098031 5.2689063 21.707031 4.8789062 L 19.121094 2.2929688 C 18.926094 2.0979687 18.670063 2 18.414062 2 z M 18.414062 4.4140625 L 19.585938 5.5859375 L 18.292969 6.8789062 L 17.121094 5.7070312 L 18.414062 4.4140625 z M 15.707031 7.1210938 L 16.878906 8.2929688 L 6.171875 19 L 5 19 L 5 17.828125 L 15.707031 7.1210938 z"
                  >
                  </path>
                </svg>
                Edit
              </button>
            </li>
            <li>
              <button
                class="flex px-3 py-2 text-sm"
                role="menuitem"
                onClick={onClickDelete}
              >
                <svg
                  class="w-5 h-5 mr-1 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M 10 2 L 9 3 L 3 3 L 3 5 L 4.109375 5 L 5.8925781 20.255859 L 5.8925781 20.263672 C 6.023602 21.250335 6.8803207 22 7.875 22 L 16.123047 22 C 17.117726 22 17.974445 21.250322 18.105469 20.263672 L 18.107422 20.255859 L 19.890625 5 L 21 5 L 21 3 L 15 3 L 14 2 L 10 2 z M 6.125 5 L 17.875 5 L 16.123047 20 L 7.875 20 L 6.125 5 z"
                  >
                  </path>
                </svg>
                Delete
              </button>
            </li>
          </ul>
        </div>
      )}
      {isIncomeModalOpen && (
        <IncomeModal>
          <IncomeForm income={income} closeModal={closeIncomeModal} />
        </IncomeModal>
      )}
      {isConfirmationModalOpen && (
        <ConfirmationModal>
          <ConfirmationModalContent
            closeModal={closeConfirmationModal}
            title="Delete income"
            message="Confirm to delete this income."
            onConfirm={deleteExpense}
            buttonText="Delete"
          />
        </ConfirmationModal>
      )}
    </div>
  );
}
