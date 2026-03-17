from manim import *

class Output(Scene):
    def construct(self):
        self.camera.background_color = "#000000"
        equation = MathTex("a^2 + b^2 = c^2")
        self.play(Write(equation))
        self.wait()