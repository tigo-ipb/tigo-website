"use client";

import { useState } from "react";
import { format } from "date-fns";
import { IconX, IconDownload, IconLoader2 } from "@tabler/icons-react"; 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "./ui/dialog";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";

export default function DateModal({ 
  title, 
  actionLabel, 
  onAction, 
  triggerNode, 
  isExport = false 
}) {
  // State sekarang hanya menyimpan satu nilai Date (bukan object from/to)
  const [date, setDate] = useState();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleActionClick = async () => {
    try {
      setIsLoading(true);
      // Format 1 tanggal saja
      const dateStr = date ? format(date, "yyyy-MM-dd") : null;

      await onAction(dateStr);
      setIsOpen(false); 
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{triggerNode}</DialogTrigger>
      
      <DialogContent className="!max-w-full md:!max-w-fit w-screen h-[100dvh] md:h-auto flex flex-col gap-4 p-4 bg-white !rounded-none md:!rounded-2xl !border-none overflow-hidden [&>button]:hidden shadow-2xl transition-all duration-300">
        
        {/* Header Modal */}
        <DialogHeader className="flex flex-row items-center justify-between p-0 shrink-0">
          <DialogTitle className="text-xl md:text-xl font-medium text-black">{title}</DialogTitle>
          <DialogClose asChild>
            <button className="p-2 bg-transparent hover:bg-neutral-100 rounded-lg transition-colors">
              <IconX className="w-6 h-6 text-black" stroke={2} />
            </button>
          </DialogClose>
        </DialogHeader>

        {/* Area Kalender */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-0 no-scrollbar">
          <div className="bg-sky-50 border border-sky-500 rounded-[16px] flex justify-center w-full md:w-max p-2 md:p-3 mx-auto">
            <Calendar
              initialFocus
              mode="single" // 🔥 Ubah mode ke single
              defaultMonth={date}
              selected={date}
              onSelect={setDate}
              numberOfMonths={1} // 🔥 Cukup tampilkan 1 bulan agar bentuknya compact/kotak
              className="w-fit mx-auto flex justify-center rounded-[16px] bg-sky-50 relative"
              classNames={{
                months: "flex flex-col md:flex-row gap-4 w-full justify-center items-center md:items-start",
                month: "space-y-4",
                
                caption: "flex justify-center relative items-center h-9 mb-6",
                caption_label: "text-base font-medium text-black",
                nav: "flex items-center justify-between w-full absolute top-0 left-0 h-9 px-2",
                
                button_next: "h-9 w-9 bg-sky-50 rounded-[8px] border border-sky-500 hover:border-sky-500 hover:bg-sky-100 flex items-center justify-center transition-colors z-10",
                button_previous: "h-9 w-9 bg-sky-50 rounded-[8px] border border-sky-500 hover:border-sky-500 hover:bg-sky-100 flex items-center justify-center transition-colors z-10",
                table: "border-collapse space-y-1",
                head_row: "flex justify-center",
                head_cell: "text-neutral-500 font-normal text-xs w-9 md:w-10",
                row: "flex mt-1 justify-center",
                
                // 🔥 Hapus class background block/range (has[aria-selected]) dari cell
                cell: "text-center text-sm p-0 relative focus-within:relative focus-within:z-20 w-9 h-9 md:w-10 md:h-10",
                
                day: "h-9 w-9 md:w-10 md:h-10 p-0 font-medium text-black rounded-[10px] hover:!bg-sky-500 hover:!text-white transition-colors [&>button]:!bg-transparent [&>button]:!text-inherit [&>button]:!w-full [&>button]:!h-full [&>button]:!shadow-none rounded-md",
                
                // State saat terpilih (Active)
                selected: "bg-sky-500 text-white hover:bg-sky-500 hover:text-white focus:bg-sky-500 focus:text-white font-bold rounded-md",
                
                outside: "opacity-25",
                day_hidden: "invisible",
              }}
            />
          </div>
        </div>

        {/* Footer Tombol */}
        <div className="p-0 bg-white mt-auto shrink-0">
          <Button 
            onClick={handleActionClick}
            disabled={isLoading || !date} // 🔥 Tombol mati jika tanggal belum dipilih
            className="w-full bg-sky-500 hover:bg-sky-600 text-white py-7 md:py-6 rounded-[10px] font-semibold text-base transition-all active:scale-[0.98]"
          >
            {isLoading ? <IconLoader2 className="w-5 h-5 mr-2 animate-spin" stroke={2} /> : isExport ? <IconDownload className="w-5 h-5 mr-2" stroke={2} /> : null}
            {actionLabel}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}