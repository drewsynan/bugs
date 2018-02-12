import React, { Component } from 'react';
import styled from 'styled-components';
import { BugController, SpiderController } from './bug-screen';
import bugSprite from './bug-screen/fly-sprite.png';
import spiderSprite from './bug-screen/spider-sprite.png';

const StyledScreen = styled.div`
    font-family: 'Source Sans Pro';
    position: fixed;
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    text-transform: uppercase;
    letter-spacing: 1px;
`;


class LoadingScreen extends Component {
    render () {
        return (<StyledScreen innerRef={el => this.domRef = el}>Loading</StyledScreen>)
    }
    componentDidMount () {
        this.bugController = new BugController({imageSprite: bugSprite})
        this.spiderController = new SpiderController({imageSprite: spiderSprite})
    }
    componentWillUnmount () {
        this.bugController.end()
        this.spiderController.end()
    }
}

export default LoadingScreen;