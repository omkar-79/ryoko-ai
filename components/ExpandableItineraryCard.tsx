import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useOutsideClick } from "../hooks/use-outside-click";
import { ItineraryItem, GroundingChunk } from "../types";
import { getLocationImage } from "../utils/getLocationImage";

interface ExpandableItineraryCardProps {
  item: ItineraryItem;
  dayTitle: string;
  dayNumber: number;
  sources?: GroundingChunk[];
}

const ExpandableItineraryCard: React.FC<ExpandableItineraryCardProps> = ({ item, dayTitle, dayNumber, sources = [] }) => {
  const [active, setActive] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(false);
      }
    }

    if (active) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useOutsideClick(ref, () => setActive(false));

  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(true);

  // Get image from grounding service or fallback to activity-based placeholder
  useEffect(() => {
    const loadImage = async () => {
      setImageLoading(true);
      try {
        // Try to get image from grounding service first
        const locationImage = await getLocationImage(item.activity, item.googleMapsLink, sources);
        if (locationImage) {
          setImageUrl(locationImage);
          setImageLoading(false);
          return;
        }
      } catch (error) {
        console.warn('Error loading location image:', error);
      }

      // Fallback to activity-based placeholder images
      const activityLower = item.activity.toLowerCase();
      let fallbackImage = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop';
      
      if (activityLower.includes('museum') || activityLower.includes('gallery')) {
        fallbackImage = 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=600&fit=crop';
      } else if (activityLower.includes('beach') || activityLower.includes('ocean')) {
        fallbackImage = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop';
      } else if (activityLower.includes('restaurant') || activityLower.includes('food') || activityLower.includes('dinner') || activityLower.includes('lunch')) {
        fallbackImage = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop';
      } else if (activityLower.includes('park') || activityLower.includes('garden')) {
        fallbackImage = 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop';
      } else if (activityLower.includes('temple') || activityLower.includes('church') || activityLower.includes('shrine')) {
        fallbackImage = 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800&h=600&fit=crop';
      }
      
      setImageUrl(fallbackImage);
      setImageLoading(false);
    };

    loadImage();
  }, [item.activity, item.googleMapsLink, sources]);

  const cardData = {
    title: item.activity,
    description: `${item.time} • ${item.location}`,
    src: imageUrl,
    ctaText: item.googleMapsLink ? "Map" : "View",
    ctaLink: item.googleMapsLink || "#",
    content: () => {
      return (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">About this activity</h4>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {item.description}
            </p>
          </div>
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-xl">📍</span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Location</p>
                <p className="text-gray-700 dark:text-gray-300">{item.location}</p>
                {item.locationUri && (
                  <a 
                    href={item.locationUri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-semibold mt-1 inline-block"
                  >
                    View Area on Maps →
                  </a>
                )}
              </div>
            </div>
          </div>

          {item.hiddenGem && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg p-4 border-l-4 border-yellow-400">
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-bold text-amber-800 dark:text-amber-200 flex items-center gap-2">
                    <span className="text-lg">💎</span>
                    Hidden Gem: {item.hiddenGem.name}
                  </h5>
                  {item.hiddenGem.googleMapsLink && (
                    <a 
                      href={item.hiddenGem.googleMapsLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-lg text-xs font-semibold hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                    >
                      Maps
                    </a>
                  )}
                </div>
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-sm">🗺️</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                    {item.hiddenGem.location}
                  </p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {item.hiddenGem.description}
                </p>
              </div>
            </div>
          )}
        </div>
      );
    },
  };

  return (
    <>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 h-full w-full z-10"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {active ? (
          <div className="fixed inset-0 grid place-items-center z-[100]">
            <motion.button
              key={`button-${cardData.title}-${id}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.05 } }}
              className="flex absolute top-2 right-2 lg:hidden items-center justify-center bg-white rounded-full h-6 w-6 z-50"
              onClick={() => setActive(false)}
            >
              <CloseIcon />
            </motion.button>
            <motion.div
              layoutId={`card-${cardData.title}-${id}`}
              ref={ref}
              className="w-full max-w-[500px] h-full md:h-fit md:max-h-[90%] flex flex-col bg-white dark:bg-neutral-900 sm:rounded-3xl overflow-hidden"
            >
              <motion.div layoutId={`image-${cardData.title}-${id}`}>
                <img
                  width={200}
                  height={200}
                  src={cardData.src}
                  alt={cardData.title}
                  className="w-full h-80 lg:h-80 sm:rounded-tr-lg sm:rounded-tl-lg object-cover object-center"
                />
              </motion.div>

              <div>
                <div className="flex justify-between items-start p-4">
                  <div>
                    <motion.h3
                      layoutId={`title-${cardData.title}-${id}`}
                      className="font-bold text-neutral-700 dark:text-neutral-200 text-lg"
                    >
                      {cardData.title}
                    </motion.h3>
                    <motion.p
                      layoutId={`description-${cardData.description}-${id}`}
                      className="text-neutral-600 dark:text-neutral-400 text-sm"
                    >
                      {cardData.description}
                    </motion.p>
                  </div>

                  {cardData.ctaLink !== "#" && (
                    <motion.a
                      layoutId={`button-${cardData.title}-${id}`}
                      href={cardData.ctaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-3 text-sm rounded-full font-bold bg-green-500 text-white hover:bg-green-600 transition-colors"
                    >
                      {cardData.ctaText}
                    </motion.a>
                  )}
                </div>
                <div className="pt-4 relative px-4">
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-neutral-600 text-xs md:text-sm lg:text-base h-40 md:h-fit pb-10 flex flex-col items-start gap-4 overflow-auto dark:text-neutral-400 [mask:linear-gradient(to_bottom,white,white,transparent)] [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch]"
                  >
                    {typeof cardData.content === "function"
                      ? cardData.content()
                      : cardData.content}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
      <motion.div
        layoutId={`card-${cardData.title}-${id}`}
        onClick={() => setActive(true)}
        className="p-4 flex flex-col md:flex-row justify-between items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl cursor-pointer border border-gray-200 dark:border-gray-700 transition-all"
      >
        <div className="flex gap-4 flex-col md:flex-row w-full">
          <motion.div layoutId={`image-${cardData.title}-${id}`}>
            <img
              width={100}
              height={100}
              src={cardData.src}
              alt={cardData.title}
              className="h-40 w-40 md:h-14 md:w-14 rounded-lg object-cover object-center"
            />
          </motion.div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full text-xs font-semibold">
                🕐 {item.time}
              </span>
            </div>
            <motion.h3
              layoutId={`title-${cardData.title}-${id}`}
              className="font-medium text-neutral-800 dark:text-neutral-200 text-center md:text-left mb-1"
            >
              {cardData.title}
            </motion.h3>
            <motion.p
              layoutId={`description-${cardData.description}-${id}`}
              className="text-neutral-600 dark:text-neutral-400 text-sm text-center md:text-left"
            >
              {cardData.description}
            </motion.p>
          </div>
        </div>
        <motion.button
          layoutId={`button-${cardData.title}-${id}`}
          className="px-4 py-2 text-sm rounded-full font-bold bg-gray-100 hover:bg-green-500 hover:text-white text-black dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-green-500 mt-4 md:mt-0 transition-all"
        >
          {cardData.ctaText}
        </motion.button>
      </motion.div>
    </>
  );
};

const CloseIcon = () => {
  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.05 } }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-black"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  );
};

export default ExpandableItineraryCard;

