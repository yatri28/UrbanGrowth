export default function MainLayout({
  header,
  sidebar,
  children,
}) {

  return (

    <div className="
      w-full
      h-screen
      bg-[#070b14]
      text-white
      overflow-hidden
    ">

      {/* HEADER */}
      {header}

      {/* BODY */}
      <div className="
        h-[calc(100vh-72px)]
        flex
        w-full
      ">

        {/* SIDEBAR */}
        <aside className="
          w-[40%]

          border-r
          border-white/5

          bg-[#0b1220]

          overflow-hidden
          flex-shrink-0
        ">
          {sidebar}
        </aside>

        {/* MAIN CONTENT */}
        <main className="
          flex-1
          relative
          overflow-hidden
          bg-[#070b14]
        ">
          {children}
        </main>

      </div>

    </div>
  )
}