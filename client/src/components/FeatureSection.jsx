import React, { useContext } from 'react'
import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BlurCircle from './BlurCircle'
import MovieCard from './MovieCard'
import { AppContext } from '../context/AppContext'

const FeaturedSection = () => {
  const navigate = useNavigate()
  const { shows, selectedCity } = useContext(AppContext)

  const filteredShows = selectedCity
    ? shows.filter(show => show.theatres && show.theatres.some(t => t.city?.toLowerCase() === selectedCity.toLowerCase()))
    : shows;

  return (
    <div className="px-6 md:px-16 lg:px-24 xl:px-44 overflow-hidden relative">

      <div className="flex items-center justify-between mb-6 relative">
        <BlurCircle top="0" right="-80" />

        <p className="text-gray-300 font-medium text-lg">
          Now Showing
        </p>

        <button
          onClick={() => navigate('/movies')}
          className="group flex items-center gap-2 text-sm text-gray-300 cursor-pointer"
        >
          View All
          <ArrowRight className="w-4.5 h-4.5 transition group-hover:translate-x-0.5" />
        </button>
      </div>

      <div className='flex flex-wrap max-sm:justify-centerr gap-8 mt-8'>
        {filteredShows.slice(0, 4).map((show) => (<MovieCard key={show._id} movie={show} />))}
      </div>

      <div className="flex justify-center mt-20">
        <button
          onClick={() => { navigate('/movies'); window.scrollTo(0, 0) }}
          className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer"
        >
          Show more
        </button>
      </div>

    </div>
  )
}

export default FeaturedSection
