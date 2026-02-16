import React from 'react'
import { use } from 'react'
import { useParams ,useNavigate} from 'react-router-dom'
import { useEffect } from 'react'
const Loading = () => {

  const {nexturl}=useParams()
  const navigate=useNavigate()
  useEffect(()=>{
    if(nexturl){
      setTimeout(()=>{
      navigate(`/${nexturl}`)
    },8000)

    }
  },[])
    
  return (
    <div className='flex justify-center items-center h-[80vh]'>
        <div className='animate-spin rounded-full h-14 w-14 border-2 border-t-primary border-r-primary border-b-primary border-l-gray-300'></div>
    </div>
  )
}

export default Loading