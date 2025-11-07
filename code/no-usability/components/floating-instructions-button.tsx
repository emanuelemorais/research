'use client';

export default function FloatingInstructionsButton() {
  const handleClick = () => {
    window.open(process.env.NEXT_PUBLIC_PRE_FORM_LINK + '/instructions', '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 z-50 cursor-pointer"
      aria-label="Acessar instruções"
    >
      <span className="text-2xl font-bold">i</span>
    </button>
  );
}

