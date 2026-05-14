import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../style.css';
import Navbar from './Navbar';
function Service(){
    return(
        <>
        <Navbar />
        <div className='service-main'>
            <h1>This is Service</h1>
        </div>
        </>
    );
}
export default Service;