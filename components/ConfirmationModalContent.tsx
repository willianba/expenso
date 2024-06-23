type ConfirmationModalProps = {
  closeModal: () => void;
  onConfirm: (propagate: boolean) => void;
  title: string;
  message: string;
  showPropagate?: boolean;
  buttonText: string;
};

export function ConfirmationModalContent(props: ConfirmationModalProps) {
  const { closeModal, title, message, onConfirm, showPropagate, buttonText } =
    props;

  const confirmAndClose = () => {
    onConfirm(false);
  };

  const confirmAndPropagate = () => {
    onConfirm(true);
  };

  return (
    <>
      <h3 class="font-bold text-lg">{title}</h3>
      <p class="py-4">{message}</p>
      <div class="modal-action">
        <form method="dialog" class="flex gap-1">
          <button
            class="btn btn-neutral"
            onClick={closeModal}
          >
            Cancel
          </button>
          {showPropagate && (
            <button
              class="btn btn-accent"
              onClick={confirmAndPropagate}
            >
              {buttonText} and propagate
            </button>
          )}
          <button
            class="btn btn-primary"
            onClick={confirmAndClose}
          >
            {buttonText}
          </button>
        </form>
      </div>
    </>
  );
}
