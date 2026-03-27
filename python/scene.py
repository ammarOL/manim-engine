from manim import *

class Output(Scene):
    def construct(self):
        circle = Circle(radius=2, color=WHITE)
        self.add(circle)
        self.camera.background_color = BLACK
        self.wait(1)
        circle.set_color(RED)
        self.wait(1)
        circle.set_color(BLUE)
        self.wait(1)
        circle.set_color(GREEN)
        self.wait(1)
        circle.set_color(YELLOW)
        self.wait(1)