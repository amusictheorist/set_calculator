import math
from functools import reduce

class PartialSet(set):
    def __init__(self, elements):
        """Initialize a partial set, ensuring all elements are positive integers."""
        if not isinstance(elements, (set, list, tuple, range, int)):
            raise TypeError('A partial set must be initialized with a set, a list, a tuple, or a range.')

        filtered_elements = set(elements)
        if not filtered_elements:
            raise ValueError('A partial set cannot be empty.')
        
        if not all(isinstance(x, int) and x > 0 for x in filtered_elements):
            raise ValueError('A partial set can only contain positive integers.')
        
        super().__init__(filtered_elements)

    def HCp(self):
        return PartialSetClass(self).HCp()
    
    def cardHCp(self):
        return PartialSetClass(self).cardHCp()

    def __str__(self):
        return '{' + ', '.join(str(x) for x in sorted(self)) + '}'
    
class PartialClassSet(set):
    def __init__(self, elements):
        """Initialize a partial-class set, ensuring all elements are odd positive integers."""
        if not isinstance(elements, (set, list, tuple, range, int)):
            raise TypeError('A partial-class set must be initialized with a set, a list, a tuple, or a range.')
        
        filtered_elements = set(elements)
        if not filtered_elements:
            raise ValueError('A partial-class set cannot be empty.')
        
        if not all(isinstance(x, int) and x > 0 and x % 2 == 1 for x in filtered_elements):
            raise ValueError('All elements must be odd positive integers.')
        
        super().__init__(filtered_elements)

    def HCpc(self):
        return PartialClassSetClass(self).HCpc()
    
    def cardHCpc(self):
        return PartialClassSetClass(self).cardHCpc()

    def __str__(self):
        return '{' + ', '.join(str(e) for e in sorted(self)) + '}'

class PartialSetClass:
    def __init__(self, partial_set):
        """Initialize a partial-set class with a PartialSet and compute its representative set."""
        if not isinstance(partial_set, PartialSet):
            raise TypeError('A partial-set class must be initialized with a partial set.')
        self.partial_set = partial_set
        self.representative_set = self._reduce_set(partial_set)

    def _reduce_set(self, partial_set):
        elements = list(partial_set)
        gcd = reduce(math.gcd, elements)
        return PartialSet({e // gcd for e in elements})
    
    def is_member(self, partial_set):
        if not isinstance(partial_set, PartialSet):
            return False
        
        reduced_set = self._reduce_set(partial_set)
        return reduced_set == self.representative_set
    
    def __eq__(self, other):
        if isinstance(other, PartialSetClass):
            return self.representative_set == other.representative_set
        return False
    
    def __iter__(self):
        n = 1
        while n <= 10:
            yield PartialSet({e * n for e in self.representative_set})
            n += 1

    def HCp(self):
        return sum(self.representative_set)
    
    def cardHCp(self):
        cardinality = len(self.representative_set)
        factor = 1/((cardinality*(cardinality+1))/2)
        HCp = self.HCp()
        return round(HCp * factor, 2)
    
    def __str__(self):
        return f"[{', '.join(map(str, sorted(self.representative_set)))}]"
    
class PartialClassSetClass:
    def __init__(self, input_set):
        """Initialize a partial-class set class with a PartialClassSet, PartialSet, or PartialSetClass and compute its representative set."""
        from calculator.utils import par_to_parc

        if isinstance(input_set, PartialSet):
            partial_class_set = PartialClassSet(par_to_parc(input_set))

        elif isinstance(input_set, PartialSetClass):
            partial_class_set = PartialClassSet(par_to_parc(input_set.representative_set))

        elif isinstance(input_set, PartialClassSet):
            partial_class_set = input_set

        else:
            raise TypeError('A partial-class set class must be initialized with a partial set, a partial-set class, or a partial-class set.')
        
        self.partial_class_set = partial_class_set
        self.representative_set = self._reduce_set(partial_class_set)

    def _reduce_set(self, partial_class_set):
        elements = list(partial_class_set)
        gcd = reduce(math.gcd, elements)
        return PartialClassSet({e // gcd for e in elements})
    
    def is_member(self, partial_class_set):
        if not isinstance(partial_class_set, PartialClassSet):
            return False
        
        reduced_set  = self._reduce_set(partial_class_set)
        return reduced_set == self.representative_set
    
    def __eq__(self, other):
        if isinstance(other, PartialClassSetClass):
            return self.representative_set == other.representative_set
        return False
    
    def __iter__(self):
        n = 1
        while n <= 10:
            yield PartialClassSet({e * n for e in self.representative_set})
            n += 2

    def HCpc(self):
        return sum(self.representative_set)
    
    def cardHCpc(self):
        cardinality = len(self.representative_set)
        factor = 1/(cardinality**2)
        HCpc = self.HCpc()
        return round(HCpc * factor, 2)
    
    def __str__(self):
        return f"[{', '.join(map(str, sorted(self.representative_set)))}]"