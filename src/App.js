import React, { Component } from 'react';
import 'source-sans-pro/source-sans-pro.css';
import './App.css';
import TreeMap from './TreeMap';
import { csv, schemeCategory20, format } from 'd3';

import samplesPerRoom from './data/samples_per_room_type.csv';
import samplesPerOrder from './data/samples_per_order.csv';
import roomsWithX from './data/rooms_having_type_x.csv';
import correspondenceAnalysis from './data/ca.csv';

import HoverDisplay from './HoverDisplay';
import SelectionBasket from './SelectionBasket';
import SelectionBar from './SelectionBar';
import ResetButton from './ResetButton';
import LoadingScreen from './LoadingScreen';
import CAGraph from './CAGraph';
import SelectorLink from './SelectorLink';

import ExternalIcon from './icon_external_link.png';

import isEqual from 'lodash/isEqual';
import datalib from 'datalib';

window.dl = datalib;

// let colorScheme = '#66C5CC,#F6CF71,#F89C74,#DCB0F2,#87C55F,#9EB9F3,#FE88B1,#C9DB74,#8BE0A4,#B497E7,#D3B484,#B3B3B3'.split(',');
let colorScheme = schemeCategory20

class App extends Component {
  constructor (props) {
    super(props)
    this.state = {}
  }

  async loadCSV (csvFile, rowParser) {
    return new Promise ((resolve, reject) => {
      csv (csvFile, (error, data) => {
        if (error) {
          reject (error)
        } else {
          if (rowParser) {
            data.forEach(row => rowParser(row))
          }
          resolve (data)
        }
      })
    })
  }

  async loadData () {
    let data = {
        correspondenceAnalysis: await this.loadCSV(correspondenceAnalysis, d => {
          d.Dim1 = +d.Dim1
          d.Dim2 = +d.Dim2
          d.Dim3 = +d.Dim3
          d.Dim4 = +d.Dim4
          d.Dim5 = +d.Dim5
          d.Dim6 = +d.Dim6
        }),
        roomsWithX: await this.loadCSV(roomsWithX, d => {
          d.value = +d.value
          d.absent = +d.absent
          d.room_total = +d.room_total
          d.order_room_total = +d.order_room_total
        }),
        samplesPerRoom: await this.loadCSV(samplesPerRoom, d => {d.value = +d.value}),
        samplesPerOrder: await this.loadCSV(samplesPerOrder, d => {d.value = +d.value}),
        dataLoaded: true
      }

    return new Promise(resolve => this.setState(data, resolve))
  }

  async finishLoad () {
    let app = this
    return new Promise(resolve => {
      window.setTimeout(() => {
        app.setState({loaded: true}, resolve)
      }, 3000) // 3000 to see spiders
    })
  }

  render() {
    // old dimensions w=1024, h=600
    let contents = <LoadingScreen />
    if (this.state.loaded) {

contents = <div>
  <div className="sidebar">
      <div className="InfoAndSelector">
          <div>
            <HoverDisplay data={this.state.roomsWithX} />
            <SelectionBasket 
              exportEager={true}
              data={this.state.samplesPerRoom} />
          </div>

          <SelectionBar data={this.state.roomsWithX} />
      </div>
  </div>
  <div className="main-content">
      <div className="section">
        <h1 className="opening">Arthropods of the great indoors</h1>
        <h1 className="heading">&nbsp;</h1>
        <p>Our homes aren&rsquo;t as clean and empty as we&rsquo;d like to imagine. 
        A <a href="https://peerj.com/articles/1582/" target="_blank">2016 study <img src={ExternalIcon} alt="" /></a> found that
        there are, in fact, a <em>lot</em> of bugs crawling around with us. Some are nuisances, most benign and unnoticed. 
        But what exactly is living with us in our homes? This site is an interactive explorer of the authors&rsquo; 
        data helping to answer that question. From the study:</p>

        <p className="blockquote">&ldquo;Although humans and arthropods have been living and evolving together for all of our history, 
        we know very little about the arthropods we share our homes with apart from major pest groups. 
        Here we surveyed, for the first time, the complete arthropod fauna of the indoor biome in 50 houses 
        (located in and around Raleigh, North Carolina, USA). We discovered high diversity, 
        with a conservative estimate range of 32–211 morphospecies, and 24–128 distinct arthropod 
        families per house. The majority of this indoor diversity (73%) was made up of true flies 
        (<SelectorLink selection={{order: 'Diptera'}}>Diptera</SelectorLink>), spiders 
        (<SelectorLink selection={{order: 'Araneae'}}>Araneae</SelectorLink>), 
        beetles (<SelectorLink selection={{order: 'Coleoptera'}}>Coleoptera</SelectorLink>), and wasps and kin 
        (<SelectorLink selection={{order: 'Hymenoptera'}}>Hymenoptera</SelectorLink>, 
        especially ants: <SelectorLink selection={{order: 'Hymenoptera', family: 'Formicidae'}}>Formicidae</SelectorLink>). 
        Much of the arthropod diversity within 
        houses did not consist of synanthropic species, but instead included arthropods that were 
        filtered from the surrounding landscape. As such, common pest species were found less 
        frequently than benign species. Some of the most frequently found arthropods in houses, 
        such as gall midges (<SelectorLink selection={{order: 'Diptera', family: 'Cecidomyiidae'}}>Cecidomyiidae</SelectorLink>) 
        and book lice (<SelectorLink selection={{order: 'Psocodea', family: 'Liposcelididae'}}>Liposcelididae</SelectorLink>), 
        are unfamiliar to the general 
        public despite their ubiquity. These findings present a new understanding of the diversity, prevalence, 
        and distribution of the arthropods in our daily lives. Considering their impact as household pests, 
        disease vectors, generators of allergens, and facilitators of the indoor microbiome, 
        advancing our knowledge of the ecology and evolution of arthropods in homes has major economic 
        and human health implications.&rdquo;</p>
      </div>

      <div className="section">
        <h1 className="heading">A data explorer</h1>
        <p>The authors present their data as one very long, and hard to read table. (To be fair, there are 
          some fun, bug-themed pie charts.) However, after reading the paper, I was left without a clear big picture
          view of bugs they collected, and how they were distrubuted around different rooms in the home. The format of the
          paper also makes it almost impossible to make comparisons between different bugs, and combination of bugs. 
          Rather than being any sort of finished presentation of the data, this project aims to serve as a hands-on, graphical, 
          interactive, and exploratory tool, helping answer questions, and dig up patterns.</p>
        <p>Throughout the site, text about <SelectorLink selection={{order: 'Hemiptera'}}>bugs</SelectorLink> is
        underlined, and can be hovered over to reveal more information. Clicking on most of the bug-related graphics
        and links will take the bug you&rsquo;re looking at and put it in your &ldquo;bug basket.&rdquo; The 
        basket exists to hopefully make it easier to quickly compare between many different bug famlies and orders. 
        To clear your basket, click the small close button next to 
        each bug&rsquo;s icon, or the reset button in the lower left-hand corner by the search box.</p>
        <p>The search/dropdown box in the bottom left corner lets you both browse and search for bugs by
        order name, family name, and common names. Throughout the site, all of the graphics are designed
        to be linked together, so that highlighting or clicking on a bug on one reveals data for the same bug in 
        other other graphics. External links, and links to more information in Wikipedia are marked with a <img src={ExternalIcon} alt="" />.</p>
      </div>
      <div className="section">
        <h1 className="heading">The bugs collected</h1>
            <p>This visualization (called a <a href="https://en.wikipedia.org/wiki/Treemap" target="_blank">treemap<img src={ExternalIcon} alt="" /></a>)
            shows the number bug samples the study authors collected in 50 different houses. The area of each box
            is proportional to the total number of specimins collected. In the larger graphic, each individual box represents a 
            family of bugs (<SelectorLink selection={{order: 'Hymenoptera', family: 'Formicidae'}}>ants</SelectorLink>, for example). 
            The boxes are colored by the order each family belongs to (<SelectorLink selection={{order: 'Hymenoptera'}}>Hymenoptera</SelectorLink> is 
            the order for <SelectorLink selection={{order: 'Hymenoptera', family: 'Formicidae'}}>ants</SelectorLink>). 
            In the larger graphic, all the samples are further broken down by each kind of room the researchers collected from, 
            showing the distribution and relative frequencies of families and orders by room. In the smaller graphic, 
            only the orders of all the samples, not divided by either room or family are shown.</p>
            <p className="instructions">Hover over a square to display more information about the family and order of the samples
               collected.<br />Click to add a specimin to the bug basket for later examination.</p>
                <div className="Treemaps">
                    <div className="FamilyTreemap">
                      <h2 className="subhead">Taxonomic families by room</h2>
                      <TreeMap data={this.state.samplesPerRoom}
                              height={600}
                              width={500}
                              colorScheme={colorScheme}

                              color={d => d.order}
                              label={d => d.family}
                              value={d => d.value}
                              valueAnnotation={d => d.family_common}
                              toolTip={d => (`${d.room} room: ${d.family} (${d.family_common}) – ${format(",d")(d.value)}`)}

                              categoryColor={d => d.room}
                              categoryLabel={d => d.room}

                              export={d => ({order: d.order, family: d.family})}
                              exportEager={(newSelection, currentSelection) => {
                                // when should a new selection be kept in the selection basket?

                                let isAFamilySelector = currentSelection.family
                                let differentOrder = newSelection.order !== currentSelection.order
                                let isntItself = !isEqual(newSelection, currentSelection)

                                return (isntItself && isAFamilySelector) || differentOrder
                              }}

                              import={selection => selection} />
                      </div>

                    <div className="OrderTreemap">
                      <h2 className="subhead">Taxonomic orders for all samples</h2>
                      <TreeMap data={this.state.samplesPerOrder}
                               height={240}
                               width={200}
                               colorScheme={colorScheme}
                               
                               color={d => d.order}
                               label={d => d.order}
                               value={d => d.value}
                               valueAnnotation={d => d.order_common}
                               toolTip={d => (`${d.order} (${d.order_common}) – ${format(",d")(d.value)}`)}

                               export={d => ({order: d.order})}
                               exportEager={true}

                               import={selection => ({order: selection.order})}
                               importEager={true} />
                      <ResetButton>Clear All Selections</ResetButton>
                    </div>{/* end order treemap */}
                
                </div> {/* end treemaps */}
      </div> {/* end sample info section */}
      <div className="section">
        <h1 className="heading">Relationships between bugs and rooms</h1>
        <p>This is a visualization of 
        a <a href="https://en.wikipedia.org/wiki/Correspondence_analysis" target="_blank">correspondence analysis<img src={ExternalIcon} alt="" /></a> of the bug data.
        Bug families are shown as dots, and room types as squares. Basically, the closer that a bug family is to a room type
        in the graph, the more likely there&rsquo;s an association between that bug family and a particular room. For example,
        we see that <SelectorLink selection={{order: 'Orthoptera', family: 'Rhaphidophoridae'}}>camel crickets</SelectorLink> are much more likely to be found in basements than other places.</p>
        <CAGraph data={this.state.correspondenceAnalysis}
                            colorScheme={colorScheme}
                            color={d => d.order}

                            marginTop={20}
                            marginBottom={30}
                            marginLeft={40}
                            marginRight={20}
                            height={600}
                            width={800} />
      </div>
      <div className="section">
        <h1 className="heading">More information</h1>
        <p>That&rsquo;s all for now! But check back later... this is an ongoing project I hope to add to it as time allows.
        This project is built using <a href="https://reactjs.org/" target="_blank">React<img src={ExternalIcon} alt="" /></a> for the 
        web stuff, <a href="https://d3js.org/" target="_blank">d3.js<img src={ExternalIcon} alt="" /></a> for the graphing stuff,
        and <a href="https://www.r-project.org/" target="_blank">R<img src={ExternalIcon} alt="" /></a> for analysis, data munging, and prototyping stuff.</p>
        <p>The fonts are Adobe&rsquo;s excellent open 
        source <a href="https://github.com/adobe-fonts/source-serif-pro" target="_blank">Source Serif Pro<img src={ExternalIcon} alt="" /></a>, 
        and <a href="https://github.com/adobe-fonts/source-sans-pro" target="_blank">Source Sans Pro<img src={ExternalIcon} alt="" /></a> typefaces.</p>
        <p><a href="http://drewsynan.com" target="_blank">&copy;{(new Date()).getFullYear()} Drew Synan</a> (<a href="https://github.com/drewsynan/bugs" target="_blank">source<img src={ExternalIcon} alt="" /></a>)</p> 
      </div>
  </div>
</div>
  } // end if

      return (<div className="App">
                  <div>
                    {contents}
                  </div>
              </div>);
  }

  async componentDidMount () {
    await this.loadData()
    await this.finishLoad()
  }
}

export default App;
