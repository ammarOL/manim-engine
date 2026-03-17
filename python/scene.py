from manim import *

class Output(Scene):
    def construct(self):
        self.camera.background_color = "#000000"
        circle1 = Circle(color=RED).shift(LEFT * 2)
        circle2 = Circle(color=RED)
        circle3 = Circle(color=RED).shift(RIGHT * 2)
        circle4 = Circle(color=RED).shift(UP * 2)
        circle5 = Circle(color=RED).shift(DOWN * 2)
        circle6 = Circle(color=RED).shift(UP * 2 + LEFT * 2)
        circle7 = Circle(color=RED).shift(UP * 2 + RIGHT * 2)
        circle8 = Circle(color=RED).shift(DOWN * 2 + LEFT * 2)
        circle9 = Circle(color=RED).shift(DOWN * 2 + RIGHT * 2)
        
        self.add(circle1)
        self.wait(0.5)
        self.add(circle2)
        self.wait(0.5)
        self.add(circle3)
        self.wait(0.5)
        self.add(circle4)
        self.wait(0.5)
        self.add(circle5)
        self.wait(0.5)
        self.add(circle6)
        self.wait(0.5)
        self.add(circle7)
        self.wait(0.5)
        self.add(circle8)
        self.wait(0.5)
        self.add(circle9)
        self.wait(0.5)