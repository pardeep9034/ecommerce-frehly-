import {X} from "lucide-react"
const confirmationModal=({title,cancelBtnName,proceedBtnName,onClose,onSuccess,open})=>{
    if(!open ){
        return null;
    }

    return (
      <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f2937]/35 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-xs rounded-xl border border-[#e5e7eb] bg-white shadow-card max-h-[90vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
         {/* Header */}
                <div className="flex items-center justify-center border-b border-[#e5e7eb] px-6 py-5 sm:px-7">
                  <h2 className="font-display text-lg  font-semibold capitalize text-[#1f2937]">
                    {title}
                  </h2>
                  {/* <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg p-1 text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#1f2937]"
                  >
                    <X className="h-5 w-5" />
                  </button> */}
                </div>
            <div className="flex justify-center gap-3 pt-2 my-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#1f2937] transition-colors hover:bg-[#f3f4f6]"
            >
             {cancelBtnName}
            </button>

            <button
              type="submit"
              onClick={onSuccess}
              className="rounded-lg bg-[#0f5132] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0b4128]"
            >
              {proceedBtnName}
            </button>
          </div>



       </div>
       </div>
    )

}
export default confirmationModal;