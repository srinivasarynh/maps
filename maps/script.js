'use strict';



const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout{
    date = new Date();
    id = (Date.now() + '').slice(-10);
    clicks = 0;

    constructor(coords, distance, duration){
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
    }
    _setDescription(){
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}` 
    }
    click(){
        this.clicks++;
    }
}


class Running extends Workout{
    type = 'runnig';
    constructor(coords, distance, duration, cadence){
        super(coords, distance, duration);
        this.cadence = cadence;
        this.clacPace();
         this.type = 'running';
        this._setDescription();
    }

    clacPace(){
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}

class Cycling extends Workout{
    type = 'cycling';
    constructor(coords, distance, duration, elevationGain){
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
         this.type = 'cycling';
        this._setDescription();
    }

    calcSpeed(){
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}

// const run1 = new Running([39, -12], 5.2, 24, 128);
// const cycling1 = new Cycling([39, -12], 27, 95, 523);
// console.log(run1, cycling1);

///////////////////////////////////////////
//application architecture

class App{
    #map;
    #mapEvent;
    #workouts = [];
    #mapZoomLevel = 13;

    constructor(){
        
        this._getPosition();

        this._getLocalStorage();

        form.addEventListener('submit', this._newWorkout.bind(this));
        
        inputType.addEventListener('change', this._toggleElevationField.bind(this));

        containerWorkouts.addEventListener('click',this._moveToPopup.bind(this));

    }

    _getPosition(){
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),
                 function(){
                alert('could not get your current location');
            });
            }
    }

    _loadMap(position) {
    
            
            const {latitude} = position.coords;
            const {longitude} = position.coords;
            
            const coords = [latitude, longitude];
        
            this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
        
            L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.#map);
        
            this.#map.on('click', this._showForm.bind(this));

            this.#workouts.forEach(work => {
                this._renderworkoutMarker(work);
            });

    }

    _showForm(mapE) {
            this.#mapEvent = mapE;
            form.classList.remove('hidden');
            inputDistance.focus();
    
    }

    _hideForm(){
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => {
            form.style.display = 'grid';
        }, 1000);
    }

    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
            inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _newWorkout(e) {
        const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));

        const allpositive = (...inputs) => inputs.every(inp => inp > 0);

        e.preventDefault();

        //get data from the form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const {lat, lng} = this.#mapEvent.latlng;
        let workout;

        // check if the data is valid

        //if workout running, creat running object

        if(type === 'running'){
            const cadence = +inputCadence.value;

            if(
                // !Number.isFinite(distance) || !Number.isFinite(duration) || !Number.isFinite(cadence)
                !validInputs(distance, duration, cadence) || !allpositive(distance, duration, cadence)
                ) 
                return alert('inputs have to be positive number');

                workout = new Running([lat, lng],distance, duration, cadence);
        }

        //if workout cycling, creat cycling object
        if(type === 'cycling'){
            const elevation = +inputElevation.value;

            if(
                // !Number.isFinite(distance) || !Number.isFinite(duration) || !Number.isFinite(cadence)
                !validInputs(distance, duration, elevation) || !allpositive(distance, duration)
                ) 
                return alert('inputs have to be positive number');

                workout = new Cycling([lat, lng],distance, duration, elevation);
        }

        // add new object to workout
        this.#workouts.push(workout);

        //render workout on map   
           this._renderworkoutMarker(workout);

            //render on list
            this._renderWorkout(workout);

            //clear input fields
            this._hideForm();

            //set local storage
            this._setLocalStorage();

            
    }

    _renderworkoutMarker(workout){
        L.marker(workout.coords)
        .addTo(this.#map)
        .bindPopup(L.popup({
            maxWidth: 250,
            minWidth: 150,
            autoClose: false,
            closeOnClick: false,
            className: `${workout.type}-popup`,
        }))
        .setPopupContent(`${workout.description}`)
        .openPopup();
    }

    _renderWorkout(workout){
        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

          if(workout.type === 'running')
          html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;

        if(workout.type === 'cycling')
        html += `
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`;

        form.insertAdjacentHTML('afterend', html);  
        
    }
    _moveToPopup(e) {
        const workoutEl = e.target.closest('.workout');

        if(!workoutEl) return;

        const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id);

        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true,
            pan:{
                duration: 1,
            },
        });

    }

    _setLocalStorage(){
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }

    _getLocalStorage(){
        const data = JSON.parse(localStorage.getItem('workouts'));

        if(!data) return;

        this.#workouts = data;
        this.#workouts.forEach(work => {
        this._renderWorkout(work);
        });
    }

    reset(){
        localStorage.removeItem('workouts');
        location.reload();
    }
}

const app = new App();



