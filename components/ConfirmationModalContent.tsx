type ConfirmationModalProps = {
  closeModal: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
};

export function ConfirmationModalContent(props: ConfirmationModalProps) {
  const { closeModal, title, message, onConfirm } = props;

  return (
    <>
      <h3 class="font-bold text-lg">{title}</h3>
      <p class="py-4">{message}</p>
      <div class="modal-action">
        <form method="dialog" class="flex gap-1">
          <button
            class="btn btn-secondary"
            onClick={closeModal}
          >
            Cancel
          </button>
          <button
            class="btn btn-primary"
            onClick={onConfirm}
          >
            Confirm
          </button>
        </form>
      </div>
    </>
  );
}
