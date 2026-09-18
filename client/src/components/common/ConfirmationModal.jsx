import {X} from "lucide-react"
const ConfirmationModal=({title,cancelBtnName,proceedBtnName,onClose,onSuccess,open})=>{
    if(!open ){
        return null;
    }

    return (
      <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/35 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-xs rounded-xl border border-border bg-white shadow-card max-h-[90vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
         {/* Header */}
                <div className="flex items-center justify-center border-b border-border px-6 py-5 sm:px-7">
                  <h2 className="font-display text-lg  font-semibold capitalize text-foreground">
                    {title}
                  </h2>
                  {/* <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button> */}
                </div>
            <div className="flex justify-center gap-3 pt-2 my-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
             {cancelBtnName}
            </button>

            <button
              type="submit"
              onClick={onSuccess}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              {proceedBtnName}
            </button>
          </div>



       </div>
       </div>
    )

}
export default ConfirmationModal;