
export default function Footer() {
  const currentYear = new Date().getFullYear()
  return (
    <div>
      &copy; {currentYear} Caleb Wood. All rights reserved.
    </div>
  )
}