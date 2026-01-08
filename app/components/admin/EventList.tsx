// 'use client';

// import { useState } from 'react';
// import { format } from 'date-fns';

// interface Event {
//   _id: string;
//   name: string;
//   description: string;
//   date: string;
//   price: number;
//   coins: number;
//   registrationLink: string;
//   collabWith: string;
//   isActive: boolean;
// }

// interface EventListProps {
//   events: Event[];
//   onUpdate: () => void;
// }

// export default function EventList({ events, onUpdate }: EventListProps) {
//   const [deletingId, setDeletingId] = useState<string | null>(null);

//   const handleDelete = async (id: string) => {
//     if (!confirm('Are you sure you want to delete this event?')) {
//       return;
//     }

//     setDeletingId(id);
//     try {
//       const response = await fetch(`/api/events/${id}`, {
//         method: 'DELETE',
//       });

//       if (response.ok) {
//         onUpdate();
//         alert('Event deleted successfully');
//       } else {
//         throw new Error('Failed to delete event');
//       }
//     } catch (error) {
//       console.error('Error deleting event:', error);
//       alert('Failed to delete event');
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   const handleToggleStatus = async (id: string, currentStatus: boolean) => {
//     try {
//       const response = await fetch(`/api/events/${id}`, {
//         method: 'PATCH',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ isActive: !currentStatus }),
//       });

//       if (response.ok) {
//         onUpdate();
//         alert(`Event ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
//       }
//     } catch (error) {
//       console.error('Error updating event status:', error);
//     }
//   };

//   if (events.length === 0) {
//     return (
//       <div className="text-center py-8">
//         <p className="text-gray-500">No events found. Create your first event!</p>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white rounded-lg shadow overflow-hidden">
//       <div className="overflow-x-auto">
//         <table className="min-w-full divide-y divide-gray-200">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Event Details
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Date & Price
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Coins & Status
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Actions
//               </th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {events.map((event) => {
//               const eventDate = new Date(event.date);
//               const isPast = eventDate < new Date();
              
//               return (
//                 <tr key={event._id} className="hover:bg-gray-50">
//                   <td className="px-6 py-4">
//                     <div>
//                       <div className="flex items-center">
//                         <h4 className="text-sm font-semibold text-gray-900">
//                           {event.name}
//                         </h4>
//                         {event.collabWith && (
//                           <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
//                             Collab
//                           </span>
//                         )}
//                       </div>
//                       <p className="text-sm text-gray-500 mt-1 line-clamp-2">
//                         {event.description}
//                       </p>
//                       {event.registrationLink && (
//                         <a
//                           href={event.registrationLink}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="text-xs text-blue-600 hover:underline mt-1 inline-block"
//                         >
//                           Registration Link
//                         </a>
//                       )}
//                     </div>
//                   </td>
                  
//                   <td className="px-6 py-4">
//                     <div className="text-sm text-gray-900">
//                       {format(eventDate, 'PPP')}
//                     </div>
//                     <div className={`text-sm ${isPast ? 'text-red-600' : 'text-green-600'}`}>
//                       {isPast ? 'Past Event' : 'Upcoming'}
//                     </div>
//                     <div className="text-sm font-medium text-gray-900 mt-1">
//                       ₹{event.price}
//                     </div>
//                   </td>
                  
//                   <td className="px-6 py-4">
//                     <div className="text-sm font-medium text-yellow-600">
//                       {event.coins} coins
//                     </div>
//                     <div className="mt-2">
//                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
//                         event.isActive
//                           ? 'bg-green-100 text-green-800'
//                           : 'bg-red-100 text-red-800'
//                       }`}>
//                         {event.isActive ? 'Active' : 'Inactive'}
//                       </span>
//                     </div>
//                   </td>
                  
//                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                     <div className="flex space-x-2">
//                       <button
//                         onClick={() => handleToggleStatus(event._id, event.isActive)}
//                         className={`px-3 py-1 rounded text-xs ${
//                           event.isActive
//                             ? 'bg-red-100 text-red-700 hover:bg-red-200'
//                             : 'bg-green-100 text-green-700 hover:bg-green-200'
//                         }`}
//                       >
//                         {event.isActive ? 'Deactivate' : 'Activate'}
//                       </button>
                      
//                       <button
//                         onClick={() => handleDelete(event._id)}
//                         disabled={deletingId === event._id}
//                         className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50"
//                       >
//                         {deletingId === event._id ? 'Deleting...' : 'Delete'}
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }


'use client';

import { useState } from 'react';
import { format } from 'date-fns';

interface Event {
  _id: string;
  name: string;
  description: string;
  date: string;
  price: number;
  coins: number;
  registrationLink: string;
  collabWith: string;
  isActive: boolean;
}

interface EventListProps {
  events: Event[];
  onUpdate: () => void;
}

export default function EventList({ events, onUpdate }: EventListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Add safety check to ensure events is always an array
  const eventList = Array.isArray(events) ? events : [];

  // const handleDelete = async (id: string) => {
    // console.log('🗑️ Attempting to delete event with ID:', id);
    // if (!confirm('Are you sure you want to delete this event?')) {
    //   return;
    // }

    // setDeletingId(id);
    // try {
    //   const response = await fetch(`/api/events/${id}`, {
    //     method: 'DELETE',
    //   });

    //   if (response.ok) {
    //     onUpdate();
    //     alert('Event deleted successfully');
    //   } else {
    //     const errorData = await response.json();
    //     throw new Error(errorData.error || 'Failed to delete event');
    //   }
    // } catch (error) {
    //   console.error('Error deleting event:', error);
    //   alert(`Failed to delete event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    // } finally {
    //   setDeletingId(null);
    // }

    const handleDelete = async (id: string) => {
      console.log('🗑️ Attempting to delete event with ID:', id);
      
      if (!confirm('Are you sure you want to delete this event?')) {
        return;
      }
    
      setDeletingId(id);
      try {
        const response = await fetch(`/api/events/${id}`, {
          method: 'DELETE',
        });
    
        console.log('Delete response status:', response.status);
        const responseData = await response.json();
        console.log('Delete response data:', responseData);
    
        if (response.ok) {
          onUpdate();
          alert('Event deleted successfully');
        } else {
          throw new Error(responseData.error || 'Failed to delete event');
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        alert(`Failed to delete event: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setDeletingId(null);
      }
    };
  // };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        onUpdate();
        alert(`Event ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update event');
      }
    } catch (error) {
      console.error('Error updating event status:', error);
      alert(`Failed to update event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (eventList.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No events found. Create your first event!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Event Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Coins & Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {eventList.map((event) => {
              const eventDate = new Date(event.date);
              const isPast = eventDate < new Date();
              
              return (
                <tr key={event._id} className="hover:bg-gray-50">
                   <td className="px-6 py-4">
                     <div>
                       <div className="flex items-center">
                         <h4 className="text-sm font-semibold text-gray-900">
                           {event.name}
                         </h4>
                         {event.collabWith && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            Collab
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {event.description}
                      </p>
                      {event.registrationLink && (
                        <a
                          href={event.registrationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                        >
                          Registration Link
                        </a>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {format(eventDate, 'PPP')}
                    </div>
                    <div className={`text-sm ${isPast ? 'text-red-600' : 'text-green-600'}`}>
                      {isPast ? 'Past Event' : 'Upcoming'}
                    </div>
                    <div className="text-sm font-medium text-gray-900 mt-1">
                      ₹{event.price}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-yellow-600">
                      {event.coins} coins
                    </div>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        event.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {event.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleToggleStatus(event._id, event.isActive)}
                        className={`px-3 py-1 rounded text-xs ${
                          event.isActive
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {event.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      
                      <button
                        onClick={() => handleDelete(event._id)}
                        disabled={deletingId === event._id}
                        className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50"
                      >
                        {deletingId === event._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

