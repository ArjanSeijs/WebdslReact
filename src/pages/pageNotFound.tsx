import React from "react";
import {Col, Container, Image, Row} from "react-bootstrap";

export class PageNotFound extends React.Component {
    render() {
        return <Container className='p-5'>
            <Row className='w-100'>
                <Col md={'12'} className='d-flex justify-content-center'>
                    <Image src='https://pics.clipartpng.com/midle/Tree_PNG_Clip_Art-2890.png'/>
                </Col>
            </Row>
            <Row className='w-100'>
                <Col md={'12'} className='d-flex justify-content-center'>
                    <h1>404 Page not found</h1>
                </Col>
            </Row>
        </Container>
    }
}