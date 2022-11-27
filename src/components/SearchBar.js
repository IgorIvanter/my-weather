import { useEffect, useState, useRef, useCallback } from "react"
import useHover from "../hooks/useHover.js"
import useFocus from "../hooks/useFocus.js"
import { geoAPI } from '../constants.js'
import { formatLocationName } from "../capitalizeFirstLetter.js"
import CONSTANTS from "../constants.js"
import loadingGif from '../loading.gif'


const MIN_POPULATION = 500000	// Minimal population for a city to be displayed in the suggestions list
const INPUT_WIDTH = "20rem"		// The fixed width of the input field


function SearchBar({ state, fetchStateByCoords, setState }) {

	const dropdownStyle = {		// Inline styling for the dropdown menu
		backgroundColor: "whitesmoke",
		top: "0",
		padding: "1rem",
		borderRadius: "1rem",
		fontSize: "1.5rem",
		zIndex: 40
	}

	const commonWidthStyle = {		// Sets the same width for the input field and the dropdown menu
		display: "block",
		width: INPUT_WIDTH
	}

	const [suggestions, setSuggestions] = useState([])	// list of suggestions

	const inputRef = useRef()	// Reference to the input element

	const inputFocused = useFocus(inputRef)		// inputFocused is set to track whether inputRef.current (the input) element is focused or not

	const [dropdownRef, dropdownHovered] = useHover()	// dropdownHovered is set to track whether dropdownRef.current (dropdown menu) is hovered over or not

	const [dropdownOpened, setDropdownOpened] = useState(inputFocused)	// defines whether dropdown menu is opened or not

	const [loading, setLoading] = useState(false)

	const lastTimeoutIdRef = useRef(null)	// A ref to the last timeout ID (to clear it later if needed)

	const updateSuggestions = useCallback((lastRequestRef) => {		// updates suggestions based on current input:
		if (state.userInput === "") {
			setSuggestions([])
			return null
		}



		let id = lastRequestRef + 5

		while (id--) {
			window.clearTimeout(id); // Clearing all previous timeouts
		}

		setLoading(true)

		return setTimeout(() => {
			console.log(`Fetching for prefix '${state.userInput}'...`)
			fetch(`${geoAPI.requestStart}minPopulation=${MIN_POPULATION}&types=city&namePrefix=${state.userInput}`, geoAPI.options)
				.then(response => response.json())
				.then(json => {
					console.log("logging response: ", json)
					if (json.data === undefined) {
						return
					}
					setLoading(false)
					setSuggestions(json.data.map(city => {
						return {
							name: city.name.toLowerCase(),
							country: city.country.toLowerCase(),
							lat: city.latitude.toFixed(2),
							lon: city.longitude.toFixed(2)
						}
					}))
				}).catch(error => console.log(error))
		}, CONSTANTS.GEOCODING_REQUEST_TIMEOUT_MS)
	}, [state.userInput])

	function handleInputChange(event) {		// handles new search terms
		setState({
			...state,
			userInput: event.target ? event.target.value : ""
		})
	}

	useEffect(() => {	// This effect opens/closes the dropdown suggestions list based on inputFocused and dropdownHovered
		if (inputFocused || dropdownHovered) {
			setDropdownOpened(true)
		} else {
			setDropdownOpened(false)
		}
		if (suggestions.length === 0) {
			setDropdownOpened(false)
		}
	}, [inputFocused, dropdownHovered, state, suggestions])

	useEffect(() => {	// This effect calls the function that updates suggestions whenever userInput changes
		lastTimeoutIdRef.current = updateSuggestions(lastTimeoutIdRef.current)
	}, [state.userInput, updateSuggestions])

	return (
		<div
			className="search-container"
			style={commonWidthStyle}>
			<div className="search">
				<input
					type="text"
					placeholder="Search..."
					onChange={handleInputChange}
					value={state.userInput}
					ref={inputRef}
					style={commonWidthStyle}
				>
				</input>
			</div>
			{!loading ? <div
				className={`dropdown ${dropdownOpened && "opened"}`}
				style={dropdownStyle}
				ref={dropdownRef}>
				<ul>
					{suggestions.map((city, index) => {
						return (
							<li className="suggestion"
								onClick={() => {
									console.log("Fetching from the inside of onClick on suggestions: ", city.country, city.name)
									fetchStateByCoords(city)
									setDropdownOpened(false)
								}}
								style={{
									borderBottom: index === suggestions.length - 1 ? "none" : "2px solid grey"
								}}
								key={city.name}>
								{formatLocationName(`${city.name}, ${city.country}`)}
							</li>)
					})}
				</ul>
			</div> :
				<div
					className="dropdown opened"
					style={{
						...dropdownStyle,
					}}>
					<ul>
						<li style={{ position: "relative" }}>
							<img
								alt=""
								src={loadingGif}
								style={{
									position: "absolute",
									height: "3rem",
									marginTop: "auto",
									marginBottom: "auto",
									float: "bottom",
									top: "-0.5rem"
								}} />
							<p
								style={{
									display: "inline-block",
									marginTop: "auto",
									marginBottom: "auto",
									position: "relative",
									left: "3rem",

								}}>
								Loading...
							</p>
						</li>
					</ul>
				</div>
			}
		</div>)
}

export default SearchBar