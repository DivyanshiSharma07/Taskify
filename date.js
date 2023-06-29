
//module.exports = getDate;

//function getDate(){   
    
//instead more simplified

exports.getDate = function(){
const today = new Date();
const options = { 
 weekday: 'long',
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' };

return today.toLocaleDateString("en-US",options);
}