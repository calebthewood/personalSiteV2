import { FileText, Mail } from 'lucide-react'
import { GithubIcon, InstagramIcon, LinkedinIcon } from '../components/icons'

const LINKS = [
  { title: 'LinkedIn', href: 'https://www.linkedin.com/in/caleb-wood-440b37168/', Icon: LinkedinIcon },
  { title: 'GitHub', href: 'https://github.com/calebthewood', Icon: GithubIcon },
  { title: 'Instagram', href: 'https://www.instagram.com/calebthewood/?hl=en', Icon: InstagramIcon },
  { title: 'Email', href: 'mailto:calebwood.cs@gmail.com', Icon: Mail },
  { title: 'Resume', href: 'https://s3.us-west-1.amazonaws.com/pix.ly/Caleb_Wood_Resume.docx', Icon: FileText },
]

export function Contact() {
  return (
    <div className='flex flex-col gap-6'>
      <h2 className='text-xl sm:text-2xl'>Thanks for visiting!</h2>
      <hr className='border-black' />
      <div className='flex flex-wrap justify-between gap-4'>
        {LINKS.map(({ title, href, Icon }) => (
          <a
            key={title}
            title={title}
            href={href}
            className='flex h-16 w-16 items-center justify-center rounded-[10px] border-[3px] border-black bg-white text-black shadow-nb-sm transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none'
          >
            <Icon className='h-7 w-7' />
          </a>
        ))}
      </div>
    </div>
  )
}
